import { Table } from 'antd';
import { useInfiniteQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState,useLayoutEffect } from 'react';

interface Item {
  id: number;
  name: string;
}

interface ApiResponse {
  item: Item[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const PAGE_SIZE = 10;
const MAX_PAGES = 3;

// Mock fetch function to simulate API call
const fetchItems = async (pageParam = 1): Promise<ApiResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Calculate start and end items for this page
  const pageSize = 10;
  const start = (pageParam - 1) * pageSize + 1;
  const totalRecords = 300;
  
  // Create items for this page
  const items: Item[] = [];
  for (let i = 0; i < pageSize; i++) {
    const id = start + i;
    if (id <= totalRecords) {
      items.push({ id, name: `Item ${id}` });
    }
  }
  
  return {
    item: items,
    totalRecords: totalRecords,
    pageNumber: pageParam,
    pageSize: 10,
    page: pageParam,
    hasNextPage: pageParam * pageSize < totalRecords,
    hasPreviousPage: pageParam > 1
  };
};

export const useItemsQuery = () =>
  useInfiniteQuery({
    queryKey: ['items'],
    queryFn: ({ pageParam }) => fetchItems(pageParam),
    initialPageParam: 10,
    getPreviousPageParam: (firstPage) =>
      firstPage.hasPreviousPage ? firstPage.page - 1 : undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    maxPages: 3
  });

const queryClient = new QueryClient();

export default function InfiniteQueryComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <InfiniteQueryContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function InfiniteQueryContent() {
  const [scrollMetrics, setScrollMetrics] = useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 , isDown: true});
  //const tableBodyRef = useRef<HTMLDivElement | null>(null);


  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    fetchPreviousPage,
    isFetchingPreviousPage,
    hasPreviousPage,
    status,
  } = useItemsQuery();

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
  ];

  const dataSource = data?.pages.flatMap((page) => page.item);
  //   tableBody.scrollTo({
    //   top: ((MAX_PAGES-1)*PAGE_SIZE*scrollMetrics.scrollHeight/(MAX_PAGES*PAGE_SIZE))-50,
    //   behavior: 'smooth',
    // })

  // Attach ref to the AntD Table body after render
  useLayoutEffect(() => {
    const tableBody = document.querySelector('.ant-table-tbody-virtual-holder') as HTMLDivElement | null;
    // if (tableBody && (data?.pages?.length ?? 0) >= 3 && !isFetchingNextPage && scrollMetrics.isDown) {
    // console.log("scrollDirection",scrollMetrics.isDown)
    //   tableBody.scrollTop = ((MAX_PAGES-1)*PAGE_SIZE*scrollMetrics.scrollHeight/(MAX_PAGES*PAGE_SIZE))-50
    // }
    if (tableBody && !isFetchingPreviousPage )  {
      tableBody.scrollTop = (scrollMetrics.scrollHeight/MAX_PAGES)
      console.log("scrolTop",tableBody.scrollTop)
    }
    
  }, [data, isFetchingNextPage,isFetchingPreviousPage,scrollMetrics.scrollHeight]);


  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    setScrollMetrics({ scrollTop, scrollHeight, clientHeight, isDown: scrollTop-scrollMetrics.scrollTop>0 });

    if (scrollHeight - scrollTop - clientHeight < 50 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
    if (scrollTop < 50 && hasPreviousPage && !isFetchingPreviousPage) {
      fetchPreviousPage();
    }
  };

  return (
    <div className="infinite-query-container" style={{ padding: '90px' }}>
      <h2>Infinite Query Example</h2>
      
      {status === 'pending' ? (
        <div>Loading...</div>
      ) : status === 'error' ? (
        <div>Error loading data</div>
      ) : (
        <>
          <div className="scroll-metrics" style={{ 
            position: 'sticky', 
            top: 0, 
            padding: '10px', 
            marginBottom: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            zIndex: 1
          }}>
            <p><strong>Scroll Metrics:</strong></p>
            <p>scrollTop: {scrollMetrics.scrollTop.toFixed(0)}</p>
            <p>scrollHeight: {scrollMetrics.scrollHeight.toFixed(0)}</p>
            <p>clientHeight: {scrollMetrics.clientHeight.toFixed(0)}</p>
            <p>Scoll Direction:{scrollMetrics.isDown ? "True":"False"}</p>
            {/* <p>remaining: {(scrollMetrics.scrollHeight - scrollMetrics.scrollTop - scrollMetrics.clientHeight).toFixed(0)}</p> */}
          </div>
          
          <Table
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            pagination={false}
            scroll={{ y: 300 }}
            size='small'
            virtual
            onScroll={handleTableScroll}
          />
          <div className="stats">
            <p>Total records: {data.pages[0].totalRecords}</p>
            <p>Pages loaded: {data.pages.length}</p>
          </div>
        </>
      )}
    </div>
  );
}